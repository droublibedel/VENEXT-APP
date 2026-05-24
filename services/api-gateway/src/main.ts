import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { WsAdapter } from "@nestjs/platform-ws";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle("VENEXT API Gateway")
    .setDescription("Gateway public et endpoints temps réel internes de la plateforme VENEXT.")
    .setVersion("0.0.1")
    .addTag("health")
    .addTag("realtime")
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
