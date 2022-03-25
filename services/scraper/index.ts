import { ApolloError } from 'apollo-server-express';
import { Db, ObjectId } from 'mongodb';
import AWS from 'aws-sdk';
import { IObject, IUser } from '../../interfaces';
import { mixpanel } from '../../utils';
import config from '../../config';
import { MONGO_URL } from './../../constants';

const ecs = new AWS.ECS({
  region: 'us-east-2',
});

class ScraperService {
  db;

  constructor(db: Db) {
    this.db = db;
  }

  async run(user: IUser, inputs: string, inputsTransformed: IObject<string | number>) {
    const rawInput = JSON.parse(inputs);
    const Executions = this.db.collection('executions');
    const Scrapers = this.db.collection('scrapers');
    const Trials = this.db.collection('trials');
    const scraperMetadata = await Scrapers.findOne({
      website: inputsTransformed.website,
    });

    if (user.isTrial) {
      const currentUserTrial = await Trials.findOne({
        uid: new ObjectId(user._id),
      });

      if (currentUserTrial.recordsUsed >= 100) {
        throw new ApolloError(
          'You have extracted 100 records. Please upgrade to a paid plan to continue.',
          'FREE_RECORDS_EXCEEDED',
        );
      }
    }

    const { insertedId } = await Executions.insertOne({
      progress: 0,
      inputsTransformed,
      inputs: rawInput,
      records: 0,
      status: 'pending',
      started: null,
      stopped: null,
      uid: user._id,
      url: null,
    });

    const metadata = {
      uid: user._id.toString(),
      executionId: insertedId.toString(),
    };
    const envVariables = [
      {
        name: 'ECS_CONTAINER_STOP_TIMEOUT',
        value: '20m',
      },
      {
        name: 'MONGO_CONNECTION_STRING',
        value: MONGO_URL,
      },
      {
        name: 'STRIPE_SECRET',
        value: config.STRIPE.STRIPE_SECRET,
      },
    ];
    envVariables.push({
      name: 'inputs',
      value: JSON.stringify(inputsTransformed),
    });

    envVariables.push({
      name: 'metadata',
      value: JSON.stringify(metadata),
    });

    const params = {
      containerDefinitions: [
        {
          name: `${scraperMetadata.slug}-${metadata.uid}`,
          image: scraperMetadata.repo,
          environment: envVariables,
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-region': 'us-east-2',
              'awslogs-group': 'ScrapersExecution',
              'awslogs-stream-prefix': 'scrapespot',
            },
          },
        },
      ],
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      memory: '1024',
      cpu: '256',
      family: `${scraperMetadata.slug}-${metadata.uid}`,
      executionRoleArn: 'ecsTaskExecutionRole',
    };

    const taskDefinitionData = await ecs.registerTaskDefinition(params).promise();

    const p = {
      cluster: 'scrapers',
      taskDefinition: `${taskDefinitionData.taskDefinition.family}:${taskDefinitionData.taskDefinition.revision}`,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: ['subnet-6021840b'], // TODO: Change this to new
          assignPublicIp: 'ENABLED',
          securityGroups: ['sg-8d179bfc'], // TODO: Change this to new
        },
      },
      overrides: {
        taskRoleArn: 'arn:aws:iam::481703043626:role/ecs-task-container-role',
      },
    };

    try {
      await ecs.runTask(p).promise();
    } catch (e) {
      throw new Error('Something went wrong. Please contact customer support');
    }

    mixpanel.track('Run Scraper', {
      distinct_id: user._id.toString(),
      website: inputsTransformed.website,
      records: inputsTransformed.records,
      scraperType: inputsTransformed.scraperType,
      location: inputsTransformed.search,
    });
    mixpanel.people.increment(user._id.toString(), 'executions');

    await Executions.updateOne(
      {
        _id: insertedId,
      },
      {
        $set: {
          started: new Date(),
          message: 'Starting extraction...',
        },
      },
    );

    return {
      status: 'started',
      message: 'Scraper started succesfully',
    };
  }
}

export default ScraperService;
