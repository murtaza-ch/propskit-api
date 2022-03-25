export interface IGetMetrics {
  getMetrics: {
    executions: number;
    upcomingBill: {
      baseCost: number;
      additionalCost: number;
    };
    recordsScraped: number;
    recordsRemaining: number;
    recordsExceeded: number;
  };
}
