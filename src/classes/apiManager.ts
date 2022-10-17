import Centra from "centra"
import { Pool } from "pg"
import { GenerationInput, HordePerformanceStable, RequestAsync, RequestStatusCheck, RequestStatusStable, UserDetailsStable } from "../stable_horde_types"

export class APIManager {
    base_route: string
    database: Pool
    constructor(options: {base_route: string, database: Pool}) {
        this.base_route = options.base_route
        this.database = options.database
    }

    async getUserToken(user_id: string): Promise<string|undefined> {
        const rows = await this.database.query("SELECT * FROM user_tokens WHERE id=$1", [user_id])
        if(!rows.rowCount || !rows.rows[0]) return undefined
        return rows.rows[0].token
    }

    async getUserData(token: string): Promise<UserDetailsStable> {
        const res = await Centra(`${this.base_route}/find_user`, "GET")
        .header("apikey", token)
        .send()

        if(res.statusCode === 404) throw new Error(await res.json().then(res => res.message))

        return await res.json() as UserDetailsStable
    }

    async postAsyncGeneration(data: GenerationInput, token: string): Promise<RequestAsync> {
        const res = await Centra(`${this.base_route}/generate/async`, "POST")
        .header("apikey", token)
        .body(data, "json")
        .send()

        if(res.statusCode?.toString().startsWith("4")) throw new Error(await res.json().then(res => res.message))
        if(res.statusCode?.toString().startsWith("5")) throw new Error(await res.json().then(res => res.message))

        return await res.json() as RequestAsync
    }

    async postSyncGeneration(data: GenerationInput, token: string): Promise<RequestStatusStable> {
        const res = await Centra(`${this.base_route}/generate/sync`, "POST")
        .header("apikey", token)
        .body(data, "json")
        .send()

        if(res.statusCode?.toString().startsWith("4")) throw new Error(await res.json().then(res => res.message))
        if(res.statusCode?.toString().startsWith("5")) throw new Error(await res.json().then(res => res.message))

        return await res.json() as RequestStatusStable
    }

    async getGenerateCheck(id: string): Promise<RequestStatusCheck> {
        const res = await Centra(`${this.base_route}/generate/check/${id}`, "GET")
        .send()

        if(res.statusCode?.toString().startsWith("4")) throw new Error(await res.json().then(res => res.message))

        return await res.json() as RequestStatusCheck
    }

    async getGenerateStatus(id: string): Promise<RequestStatusStable> {
        const res = await Centra(`${this.base_route}/generate/status/${id}`, "GET")
        .send()

        if(res.statusCode?.toString().startsWith("4")) throw new Error(await res.json().then(res => res.message))

        return await res.json() as RequestStatusStable
    }

    async getStatusPerformance(): Promise<HordePerformanceStable> {
        const res = await Centra(`${this.base_route}/status/performance`, "GET")
        .send()
        return await res.json() as HordePerformanceStable
    }

    async deleteGenerateStatus(id: string) {
        const res = await Centra(`${this.base_route}/generate/status/${id}`, "DELETE")
        .send()

        if(res.statusCode?.toString().startsWith("4")) throw new Error(await res.json().then(res => res.message))

        return await res.json() as RequestStatusStable
    }
}