import {DynamoDBClient, ReturnValue} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, QueryCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {LinkStatus} from "../utils/linkEnum";

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
    try {
        const shortenedUrl = event.pathParameters.shortenedUrl;

        const getParams = {
            TableName: process.env.LINKS_TABLE,
            IndexName: "ShortenedUrlIndex",
            KeyConditionExpression: "shortenedUrl = :shortenedUrl",
            ExpressionAttributeValues: {
                ":shortenedUrl": shortenedUrl,
            },
        };

        const data = await ddbDocClient.send(new QueryCommand(getParams));
        const result = data.Items![0];

        if (!result) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Link not found", result }),
            }
        }
        if (result.status === LinkStatus.EXPIRED) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Link is expired", result }),
            }
        }

        const originalUrl = result.originalUrl;

        if (result.maxVisits !== null && result.urlVisits + 1 === result.maxVisits) {
            const updateStatusParams = {
                TableName: process.env.LINKS_TABLE,
                Key: {
                    linkId: result.linkId
                },
                UpdateExpression: "SET #status = :status",
                ExpressionAttributeNames: {
                    "#status": "status",
                },
                ExpressionAttributeValues: {
                    ":status": LinkStatus.EXPIRED,
                },
                ReturnValues: "ALL_NEW" as ReturnValue,
            };

            await ddbDocClient.send(new UpdateCommand(updateStatusParams));
        }

        const updateVisitsParams = {
            TableName: process.env.LINKS_TABLE,
            Key: {
                linkId: result.linkId
            },
            UpdateExpression: "ADD #urlVisits :inc",
            ExpressionAttributeNames: {
                "#urlVisits": "urlVisits",
            },
            ExpressionAttributeValues: {
                ":inc": 1
            },
            ReturnValues: "ALL_NEW" as ReturnValue,
        };

        await ddbDocClient.send(new UpdateCommand(updateVisitsParams));

        return {
            statusCode: 200,
            body: JSON.stringify({ originalUrl }),
        }
    } catch (err) {
        console.error("Redirect error:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};