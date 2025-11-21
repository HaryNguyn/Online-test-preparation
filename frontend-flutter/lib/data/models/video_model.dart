import 'package:equatable/equatable.dart';

class VideoModel extends Equatable {
  final String id;
  final String title;
  final String? description;
  final String youtubeUrl;
  final String youtubeId;
  final String thumbnailUrl;
  final String? subject;
  final String? gradeLevel;
  final String createdBy;
  final String? creatorName;
  final DateTime createdAt;

  const VideoModel({
    required this.id,
    required this.title,
    this.description,
    required this.youtubeUrl,
    required this.youtubeId,
    required this.thumbnailUrl,
    this.subject,
    this.gradeLevel,
    required this.createdBy,
    this.creatorName,
    required this.createdAt,
  });

  factory VideoModel.fromJson(Map<String, dynamic> json) {
    return VideoModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      youtubeUrl: json['youtube_url'] as String,
      youtubeId: json['youtube_id'] as String,
      thumbnailUrl: json['thumbnail_url'] as String,
      subject: json['subject'] as String?,
      gradeLevel: json['grade_level'] as String?,
      createdBy: json['created_by'] as String,
      creatorName: json['creator_name'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'youtube_url': youtubeUrl,
      'youtube_id': youtubeId,
      'thumbnail_url': thumbnailUrl,
      'subject': subject,
      'grade_level': gradeLevel,
      'created_by': createdBy,
      'creator_name': creatorName,
      'created_at': createdAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        youtubeUrl,
        youtubeId,
        thumbnailUrl,
        subject,
        gradeLevel,
        createdBy,
        creatorName,
        createdAt,
      ];
}
