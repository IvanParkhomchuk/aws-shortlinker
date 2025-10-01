import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { nanoid } from 'nanoid';
import jwt from "jsonwebtoken";
import { LinkStatus } from "../utils/linkEnum";

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async(event: any) => {
    try {
        const { originalUrl, shortenedUrl, maxVisits, expiresAt } = JSON.parse(event.body);

        const linkId = nanoid(6);

        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
        const userId = (decoded as any).userId;

        const putParams = {
                TableName: process.env.LINKS_TABLE,
                Item: {
                    linkId: linkId,
                    userId: userId,
                    originalUrl: originalUrl,
                    shortenedUrl: shortenedUrl,
                    urlVisits: 0,
                    status: LinkStatus.ACTIVE,
                    maxVisits: maxVisits,
                    expiresAt: expiresAt,
                }
            };

        await ddbDocClient.send(new PutCommand(putParams));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Link created successfully", shortenedUrl }),
        }
    } catch (err) {
        console.error("Create link error:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};