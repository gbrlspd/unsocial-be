import express, { Express } from 'express';
import { ApplicationServer } from './setupServer';

class Application {
  public initialize(): void {
    const app: Express = express();
    const server: ApplicationServer = new ApplicationServer(app);
    server.start();
  }
}

const application: Application = new Application();
application.initialize();
