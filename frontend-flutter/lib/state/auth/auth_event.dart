import 'package:equatable/equatable.dart';
import '../../data/models/user_model.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AuthCheckRequested extends AuthEvent {
  const AuthCheckRequested();
}

class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;

  const AuthLoginRequested({
    required this.email,
    required this.password,
  });

  @override
  List<Object?> get props => [email, password];
}

class AuthRegisterRequested extends AuthEvent {
  final String email;
  final String password;
  final String name;
  final String role;
  final String? grade;

  const AuthRegisterRequested({
    required this.email,
    required this.password,
    required this.name,
    required this.role,
    this.grade,
  });

  @override
  List<Object?> get props => [email, password, name, role, grade];
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

class AuthUserUpdated extends AuthEvent {
  final UserModel user;

  const AuthUserUpdated({required this.user});

  @override
  List<Object?> get props => [user];
}
