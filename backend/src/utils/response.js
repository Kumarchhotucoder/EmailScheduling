export function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function paginatedResponse(res, { items, page, limit, total, totalPages }, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Number(totalPages),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

export function errorResponse(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const payload = {
    success: false,
    message,
  };
  if (errors) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
}
