module.exports = function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 'P2002')
    return res.status(409).json({ message: 'Такая запись уже существует.' });
  if (error.code === 'P2025') return res.status(404).json({ message: 'Запись не найдена.' });
  if (error.code === 'P2003')
    return res.status(409).json({ message: 'Сначала удалите задачи этого предмета.' });
  if (error.type === 'entity.parse.failed')
    return res.status(400).json({ message: 'Некорректный JSON.' });
  if (error.type === 'entity.too.large')
    return res.status(413).json({ message: 'Слишком большой запрос.' });
  const status = error.status || 500;
  // Не выводим запросы, URL базы или пароли в журнал и ответы API.
  if (status >= 500) console.error('Ошибка сервера:', error.code || error.name);
  res
    .status(status)
    .json({
      message: status >= 500 ? 'Сервер временно недоступен. Попробуйте позже.' : error.message,
    });
};
