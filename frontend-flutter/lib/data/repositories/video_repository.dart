import '../providers/api_provider.dart';
import '../models/video_model.dart';
import '../../core/constants/api_constants.dart';

class VideoRepository {
  final ApiProvider _apiProvider;

  VideoRepository({required ApiProvider apiProvider})
      : _apiProvider = apiProvider;

  Future<List<VideoModel>> getVideos({
    String? subject,
    String? gradeLevel,
    String? createdBy,
  }) async {
    final response = await _apiProvider.get(
      ApiConstants.videos,
      queryParameters: {
        if (subject != null) 'subject': subject,
        if (gradeLevel != null) 'grade_level': gradeLevel,
        if (createdBy != null) 'created_by': createdBy,
      },
    );

    final videosJson = response.data['videos'] as List;
    return videosJson.map((json) => VideoModel.fromJson(json)).toList();
  }

  Future<VideoModel> getVideoById(String id) async {
    final response = await _apiProvider.get(ApiConstants.videoById(id));
    return VideoModel.fromJson(response.data['video']);
  }

  Future<VideoModel> createVideo(Map<String, dynamic> videoData) async {
    final response = await _apiProvider.post(
      ApiConstants.videos,
      data: videoData,
    );

    return VideoModel.fromJson(response.data['video']);
  }

  Future<VideoModel> updateVideo(String id, Map<String, dynamic> videoData) async {
    final response = await _apiProvider.put(
      ApiConstants.videoById(id),
      data: videoData,
    );

    return VideoModel.fromJson(response.data['video']);
  }

  Future<void> deleteVideo(String id) async {
    await _apiProvider.delete(ApiConstants.videoById(id));
  }
}
