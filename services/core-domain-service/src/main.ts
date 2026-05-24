import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1");
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle("VENEXT Core Domain API")
    .setDescription("API métier principale VENEXT exposant les domaines commerce, relations, commandes, wallet et backoffice.")
    .setVersion("0.0.1")
    .addTag("commerce-foundation")
    .addTag("relationships")
    .addTag("organizations")
    .addTag("wallets")
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3200);
}

void bootstrap();
