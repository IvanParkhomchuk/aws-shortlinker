import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { LinkStatus } from "../utils/linkEnum";

const client = new DynamoDBClient();
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
    try {
        const { linkId } = JSON.parse(event.body);

        const getParams = {
            TableName: process.env.LINKS_TABLE,
            Key: {
                linkId: linkId,
            }
        };
        
        const result = await ddbDocClient.send(new GetCommand(getParams));
        const linkData = result.Item;

        if (linkData!.status === LinkStatus.EXPIRED) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Links already expired" })
            }
        }

        const updateParams = {
            TableName: process.env.LINKS_TABLE,
            Key: {
                linkId: linkId
            },
            UpdateExpression: "SET #status = :status",
            ExpressionAttributeNames: {
                "#status": "status",
            },
            ExpressionAttributeValues: {
                ":status": LinkStatus.EXPIRED
            },
            ReturnValues: "ALL_NEW" as ReturnValue,
        };

        const updateResult = await ddbDocClient.send(new UpdateCommand(updateParams)); 

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Success", updateResult })
        }

    } catch (err) {
        console.error("Deactivate link error:", err);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};