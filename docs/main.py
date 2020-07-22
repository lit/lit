import os
import re
import jinja2
import webapp2

JINJA_ENVIRONMENT = jinja2.Environment(
  loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
  extensions=['jinja2.ext.autoescape'],
  variable_start_string='{{{{',
  variable_end_string='}}}}',
  autoescape=True)

redirects = [
  (r'/api/([^/]*)/lit_html', r'/api/\1/_lit_html_'),
  (r'/api/([^/]*)/shady_render', r'/api/\1/_lib_shady_render_')
]

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

# Serve redirects for old paths, otherwise just serve static files
class ApiDoc(webapp2.RequestHandler):
  def redirect_if_needed(self, path):
    for redirect in redirects:
      pattern = redirect[0]
      replace = redirect[1]
      if re.match(pattern, path):
        self.redirect(re.sub(pattern, replace, path), permanent=True)
        return True
    return False

  def get(self):
    if self.redirect_if_needed(self.request.path):
      return
    try:
      # path is always absolute starting with /api/. Slice off the leading slash 
      # and normalize it relative to cwd
      filepath = os.path.relpath(self.request.path[1:])
      page = open(filepath, 'rb').read()
      self.response.write(page)
    except Exception:
      template = find_template('/404.html')
      self.response.set_status(404)
      self.response.write(template.render({}))


app = webapp2.WSGIApplication([
  ('/api/.*', ApiDoc),
  ('/.*', MainPage),
])
