import {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";

const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;

if (!B2_KEY_ID || !B2_APPLICATION_KEY) {
  console.error("Erro: B2_KEY_ID ou B2_APPLICATION_KEY não definidos.");
  process.exit(1);
}

const client = new S3Client({
  region: "us-east-005",
  endpoint: "https://s3.us-east-005.backblazeb2.com",
  forcePathStyle: false,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APPLICATION_KEY,
  },
});

const Bucket = "igreja-videira-midia";

const corsConfiguration = {
  CORSRules: [
    {
      AllowedOrigins: [
        "https://midia-igreja-rho.vercel.app",
        "http://localhost:3000",
      ],
      AllowedMethods: ["GET", "HEAD", "PUT"],
      AllowedHeaders: [
        "Content-Type",
        "Cache-Control",
        "x-amz-*",
      ],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function main() {
  try {
    console.log("Aplicando CORS...");

    await client.send(
      new PutBucketCorsCommand({
        Bucket,
        CORSConfiguration: corsConfiguration,
      })
    );

    console.log("CORS aplicado com sucesso.");
    console.log("Consultando CORS atual...");

    const result = await client.send(
      new GetBucketCorsCommand({
        Bucket,
      })
    );

    console.log("CORS atual:");
    console.dir(result.CORSRules, {
      depth: null,
      colors: true,
    });

    console.log("\nTudo certo.");
  } catch (error) {
    console.error("\nErro ao configurar o CORS:");
    console.error(error);

    if (error?.$metadata) {
      console.error("\nMetadata:");
      console.error({
        httpStatusCode: error.$metadata.httpStatusCode,
        requestId: error.$metadata.requestId,
        attempts: error.$metadata.attempts,
      });
    }

    process.exit(1);
  }
}

main();
