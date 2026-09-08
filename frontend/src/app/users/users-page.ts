import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from './user-service';
import { User, UserPayload } from './user';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users-page.html',
  styleUrl: './users-page.css',
})
export class UsersPage {
  private readonly service = inject(UserService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly showForm = signal(false);

  editingId: number | null = null;

  form: UserPayload = this.emptyForm();

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(false);

    this.service.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  newUser(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.showForm.set(true);
  }

  editUser(user: User): void {
    this.editingId = user.id;

    this.form = {
      nombres: user.nombres,
      apellidos: user.apellidos,
      correo: user.correo,
      password: '',
      rol: user.rol,
      activo: user.activo,
    };

    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
  }

  save(): void {
    const request =
      this.editingId === null
        ? this.service.createUser(this.form)
        : this.service.updateUser(this.editingId, this.form);

    request.subscribe({
      next: () => {
        this.showForm.set(false);
        this.loadUsers();
      },
      error: () => alert('No se pudo guardar el usuario.'),
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`¿Eliminar a ${user.nombres} ${user.apellidos}?`)) {
      return;
    }

    this.service.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('No se pudo eliminar el usuario.'),
    });
  }

  private emptyForm(): UserPayload {
    return {
      nombres: '',
      apellidos: '',
      correo: '',
      password: '',
      rol: 'SUPERVISOR',
      activo: true,
    };
  }
}