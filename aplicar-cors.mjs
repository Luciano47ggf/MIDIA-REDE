import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "us-east-005",
  endpoint: "https://s3.us-east-005.backblazeb2.com",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

const Bucket = "igreja-videira-midia";

const cors = {
  CORSRules: [
    {
      AllowedOrigins: [
        "https://midia-igreja-rho.vercel.app",
        "http://localhost:3000",
      ],
      AllowedMethods: ["GET", "HEAD", "PUT"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    },
  ],
};

try {
  console.log("Aplicando CORS...");

  await client.send(
    new PutBucketCorsCommand({
      Bucket,
      CORSConfiguration: cors,
    })
  );

  console.log("CORS aplicado com sucesso.");

  const result = await client.send(
    new GetBucketCorsCommand({
      Bucket,
    })
  );

  console.log("CORS atual:");
  console.dir(result.CORSRules, { depth: null });
} catch (error) {
  console.error("Erro:");
  console.error(error);
}
