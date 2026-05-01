/**
 * Standardized API response wrapper
 */
class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static success(data = null, message = 'Success') {
    return new ApiResponse(200, message, data);
  }

  static created(data = null, message = 'Created successfully') {
    return new ApiResponse(201, message, data);
  }

  static paginated(data, pagination, message = 'Success') {
    return {
      success: true,
      statusCode: 200,
      message,
      data,
      pagination,
    };
  }
}

export default ApiResponse;
