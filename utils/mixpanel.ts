import Mixpanel from 'mixpanel';
import config from '../config';

const mixpanel = Mixpanel.init(config.MIXPANEL_TOKEN);

export { mixpanel };
