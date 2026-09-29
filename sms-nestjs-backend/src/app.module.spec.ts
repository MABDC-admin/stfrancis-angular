import 'reflect-metadata';
import { DashboardSummaryModule } from './dashboard-summary/dashboard-summary.module';
import { AppModule } from './app.module';

describe('AppModule', () => {
  it('registers the dashboard summary module', () => {
    const imports = Reflect.getMetadata('imports', AppModule) as unknown[];

    expect(imports).toContain(DashboardSummaryModule);
  });
});
