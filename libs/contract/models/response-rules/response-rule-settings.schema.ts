import z from 'zod';

export const ResponseRuleSettingsSchema = z
    .object({
        disableSubscriptionAccessByPath: z
            .boolean()
            .default(true)
            .optional()
            .describe(
                JSON.stringify({
                    markdownDescription:
                        "When **true** (default), path-based access such as `/xray-json`, `/mihomo`, or `/stash` is blocked and only User-Agent rules apply. When **false**, clients can bypass UA rules by requesting these paths directly.",
                }),
            ),
    })
    .optional()
    .describe(
        JSON.stringify({
            markdownDescription: 'Settings for the **response rules** config. Optional.',
        }),
    );
