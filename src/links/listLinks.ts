import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async(event: any) => {
    try {
        const authHeaders = event.headers?.Authorization || event.headers?.authorization;
        const token = authHeaders.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
        const userId = (decoded as any).userId;

        const queryParams = {
            TableName: process.env.LINKS_TABLE,
            IndexName: "UserIdIndex",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId,
            },
        };

        const result = await ddbDocClient.send(new QueryCommand(queryParams));
        const userLinks = result.Items![0];

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Successfuly", userLinks }),
        };
    } catch (err) {
        console.error("List links error:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};