import { BaseApiService } from "../base-service";
import type {
  UserResponse,
  UserUpdateRequest,
} from "./users-types";

class UsersApi extends BaseApiService {
  async update(
    id: string,
    data: UserUpdateRequest,
    token?: string,
  ): Promise<UserResponse> {
    try {
      const api = this.createApi(token);
      return api.patch<UserResponse>(`/users/${id}`, data);
    } catch (error: unknown) {
      this.handleError(error, "update", { id });
    }
  }
}

export const usersApi = new UsersApi();
