import os
import jinja2
import webapp2

JINJA_ENVIRONMENT = jinja2.Environment(
  loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
  extensions=['jinja2.ext.autoescape'],
  autoescape=True)

# Match HTML pages from path; similar to behavior of Jekyll on GitHub Pages.
def find_template(path):
  if path.endswith('/'):
    # / -> /index.html, /try/ -> /try/index.html
    return JINJA_ENVIRONMENT.get_template(path + 'index.html')
  elif path.endswith('.html'):
    # /index.html, /try/create.html
    return JINJA_ENVIRONMENT.get_template(path)
  try:
    # /try/create -> /try/create.html
    return JINJA_ENVIRONMENT.get_template(path + '.html')
  except jinja2.exceptions.TemplateNotFound:
    pass
  # /try -> /try/index.html
  return JINJA_ENVIRONMENT.get_template(path + '/index.html')

class MainPage(webapp2.RequestHandler):
  def get(self):
    try:
      template = find_template(self.request.path)
      self.response.headers['Cache-Control'] = 'public, max-age=60'
    except jinja2.exceptions.TemplateNotFound:
      template = find_template('/404.html')
      self.response.set_status(404)
    except Exception:
      template = find_template('/500.html')
      self.response.set_status(500)
    self.response.write(template.render({}))

app = webapp2.WSGIApplication([
  ('/.*', MainPage),
])
