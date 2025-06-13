import { envConfig } from "@config"
import { bearer } from "@elysiajs/bearer"
import { jwt } from "@elysiajs/jwt"
import { Elysia, t } from "elysia"

const envSchema = t.Object({
	userId: t.String(),
})

export const authPlugin = () =>
	new Elysia({
		name: "plugin.auth",
	})
		.use(bearer())
		.use(jwt({ secret: envConfig.JWT_SECRET, schema: envSchema }))
		.derive(async (ctx) => {
			if (!ctx.bearer) {
				return ctx.status("Unauthorized")
			}
			const payload = await ctx.jwt.verify(ctx.bearer)
			if (!payload) {
				return ctx.status("Unauthorized")
			}
			return {
				user: payload.userId,
			}
		})
		.macro({
			requireAuth: {
				beforeHandle(ctx) {
					if (!ctx.user) {
						return ctx.status("Unauthorized")
					}
					return ctx
				},
			},
		})
