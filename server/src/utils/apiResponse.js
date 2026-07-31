/**
 * apiResponse — Standardized API response helpers.
 *
 * Why: Consistent JSON shape across all endpoints makes the API predictable
 *      for the frontend and easier to document.
 *
 * Every successful response follows this shape:
 * {
 *   success: true,
 *   message: "...",
 *   data: { ... }         // optional
 *   pagination: { ... }   // optional, for list endpoints
 * }
 *
 * Every error response (handled by errorHandler.js) follows:
 * {
 *   success: false,
 *   message: "...",
 *   errors: [...]         // optional, for validation errors
 * }
 */

/**
 * Send a success response.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} message - Human-readable message
 * @param {*} data - Payload to return
 * @param {object} [pagination] - Pagination metadata for list endpoints
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, pagination = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) response.data = data;
  if (pagination !== null) response.pagination = pagination;

  return res.status(statusCode).json(response);
};

/**
 * Build pagination metadata for list responses.
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} total - Total document count
 */
const paginate = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { sendSuccess, paginate };
