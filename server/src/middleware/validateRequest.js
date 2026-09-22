const httpError = require('../utils/httpError');
exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success)
    return res
      .status(400)
      .json({ message: 'Проверьте поля формы.', errors: result.error.flatten().fieldErrors });
  req.body = result.data;
  next();
};
exports.validateId = (req, res, next) => {
  if (
    !/^\d+$/.test(req.params.id) ||
    !Number.isSafeInteger(Number(req.params.id)) ||
    Number(req.params.id) < 1 ||
    Number(req.params.id) > 2147483647
  ) {
    throw httpError(400, 'Некорректный идентификатор.');
  }
  req.objectId = Number(req.params.id);
  next();
};
