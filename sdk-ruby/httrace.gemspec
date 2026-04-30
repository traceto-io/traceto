Gem::Specification.new do |s|
  s.name          = 'httrace'
  s.version       = '0.1.1'
  s.summary       = 'Httrace Rack middleware — capture real traffic, auto-generate tests'
  s.description   = 'Rack middleware for Rails, Sinatra and any Rack app. Captures real HTTP traffic and sends it to the Httrace API, which automatically generates integration tests from it.'
  s.authors       = ['Httrace']
  s.email         = ['founders@httrace.com']
  s.homepage      = 'https://httrace.com'
  s.license       = 'MIT'

  s.files         = Dir['lib/**/*.rb', 'README.md', 'LICENSE']
  s.require_paths = ['lib']

  s.required_ruby_version = '>= 3.0'

  s.metadata = {
    'source_code_uri' => 'https://github.com/httrace-io/httrace',
    'homepage_uri'    => 'https://httrace.com',
    'bug_tracker_uri' => 'https://github.com/httrace-io/httrace/issues',
  }
end
