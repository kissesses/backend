export class OAuth2CallbackResponseModel {
    public readonly accessToken: string;

    constructor(data: { accessToken: string }) {
        this.accessToken = data.accessToken;
    }
}
