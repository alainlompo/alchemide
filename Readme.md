# Alchemide - Erlang / Elixir dedicated IDE

## Deprecation note
Alchemide is no longer supported as a standalone editor. In favor of not re-inventing the wheel we moved whole functionality to [atom.io](atom.io) in a form of independent plugins.  
Soon we'll be creating a github page dedicated to Erlang / Elixir tools for atom editor.  
For now take a look at:
- Erlang Autocompleter          - https://atom.io/packages/autocomplete-erlang
- Erlang linter                 - https://atom.io/packages/linter-erlc
- Erlang langugae highlighting  - https://atom.io/packages/language-erlang
- Elixir Autocompleter          - https://atom.io/packages/autocomplete-elixir
- Elixir linter                 - https://atom.io/packages/linter-elixirc
- Elixir langugae highlighting  - https://atom.io/packages/language-elixir


- [About Alchemide](#about)  
- [Installation](#installation)  
  - [Linux](#linux)
  - [MacOS](#mac-os)
  - [Windows](#windows)
- [FAQ](#faq)  
- [License](#license)

## About 
Alchemide (former ErlHickey) is an open source dedicated Erlang / Elixir editor.  
It's developed on the top of ACE Editor with Node.js as a backend.  
Latest version ( 0.2.4 ) of Alchemide supports:  

- Syntax highlighting
- Autocompletion of Stdlib libraries ( Both Erlang and Elixir )
- Project directory browsing
- Built-in terminal with erl and iex tab-completion
- Quick-open file from the project
- Floating window displaying function definition
- Macros
- Multiple selection editting
- Finding and replacing in file
- Very easy to extend because of simple logic written in JavaScript 

## Installation
[Download link](https://drive.google.com/open?id=0B7w-FN9jiHQoZEM1QzNtcGhGLTg&authuser=0)

#### Linux 
  To install on Linux download Linux version and make sure you've got:
      - erl
      - mix
      - iex
      - /bin/sh
  In your PATH, and if it requires sudo access, then remember to launch Alchemide as su.

#### Mac-OS
   Currently there is has been no tests of Alchemide running on MacOS. If you've got any problems running it 
   please feel free to contribute to [issues](https://github.com/iraasta/alchemide/issues) section.

#### Windows
  Currently we're working on Windows support for Alchemide. It can be launched on it, but we don't guarantee
  stability

## FAQ

##### Can I extend Alchemide to use Brainfuck language? (Or any other)
Yes! Alchemide is fully extendible because of great job C9 did with ACE. You can add any language support,
although ACE Editor supports a lot of them out of the box.
You can get basicly any language highlighed in Alchemide.
Autocompletion works in naive mode by default, but You can add intelligent completion on the server side
with HTTP interface

##### Is Alchemide production ready?
Nope. Alchemide project started 3 March 2015 and is considered to be in early stage development.

##### Can I use Alchemide on my website?
If You'd like than of course You can. I'd appreciate a note with a link to this repository though

##### How can I check what's already supported and what's not?
I recommend taking a look at Alchemide's [official Trello page](https://trello.com/b/299ZIZkT/alchemide)

##### Can I join Alchemide team?
Of course. We're open source and we appreciate any help. Whoever You are - designer, coder, erlang/elixir passionate, a guy with great ideas - we appreciate any help of Yours.
