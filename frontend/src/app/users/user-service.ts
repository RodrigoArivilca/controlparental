import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserPayload } from './user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/v1/usuarios';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.url);
  }

  createUser(payload: UserPayload): Observable<User> {
    return this.http.post<User>(this.url, payload);
  }

  updateUser(id: number, payload: UserPayload): Observable<User> {
    return this.http.put<User>(`${this.url}/${id}`, payload);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
