import jwt from "jsonwebtoken";

export const handler = async(event: any) => {
    try {
        const token = event.authorizationToken?.replace("Bearer ", "");

        if (!token) {
            throw new Error('Unauthorized');
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);

        return generatePolicy((decoded as any).userId, 'Allow', event.methodArn);
    } catch (err) {
        console.error('Authorization error: ', err);

        throw new Error("Unauthorized");
    }
};

function generatePolicy(principalId: string, effect: string, resource: string) {
    return {
        principalId,
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: effect,
                    Resource: resource
                }
            ]
        }
    };
}