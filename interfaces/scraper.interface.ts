import { IObject } from './index';

export interface IScraperInputs {
  inputs: string;
  inputsTransformed: IObject<string | number>;
}
