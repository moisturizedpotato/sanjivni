import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
	from backend.wsgi import application
except Exception as exc:
	_startup_error = f'{type(exc).__name__}: {exc}'

	def application(environ, start_response):
		body = f'Django startup failed: {_startup_error}'.encode('utf-8')
		start_response('500 Internal Server Error', [
			('Content-Type', 'text/plain; charset=utf-8'),
			('Content-Length', str(len(body))),
		])
		return [body]

app = application
handler = application
