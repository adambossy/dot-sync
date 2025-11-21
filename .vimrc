" ---------- Basics ----------
set nocompatible              " disable old vi compatibility
filetype plugin indent on     " enable filetype detection, plugins & indent
syntax on                     " turn on syntax highlighting
set encoding=utf-8            " use UTF-8 as default encoding

" ---------- UI ----------
set number                     " show absolute line numbers
set cursorline                 " highlight current line
set nowrap                     " don't wrap long lines
set showmatch                  " briefly jump to matching bracket
set laststatus=2               " always show the statusline
set ruler                      " show line/column position
set wildmenu                   " enhanced command-line completion menu
set wildmode=longest:full,full " completion behavior in command mode

" Minimal statusline
set statusline=%f%m%r%h%w\ %=%l/%L:%c  " file info + cursor position

" ---------- Editing ----------
set tabstop=4                  " display width of a tab character
set shiftwidth=4               " indent size for autoindent/>>/<<
set expandtab                  " insert spaces instead of tab chars
set smartindent                " simple auto-indentation
set backspace=indent,eol,start " make backspace work properly in insert

" ---------- Search ----------
set ignorecase                 " case-insensitive search by default
set smartcase                  " switch to case-sensitive if pattern has caps
set incsearch                  " show matches as you type
set hlsearch                   " highlight all search matches

" ---------- Files ----------
set autoread                   " auto-reload file if changed externally
set hidden                     " allow buffer switching without saving
set backup                     " enable backup files
set backupdir=~/.local/state/nvim/backup/ " write backups outside cwd

" Persistent undo
if has('persistent_undo')      " check if Vim supports persistent undo
  set undofile                  " save undo history to disk
  if !isdirectory($HOME . '/.vim/undo')
    call mkdir($HOME . '/.vim/undo', 'p', 0700) " create undo dir if missing
  endif
  set undodir^=$HOME/.vim/undo// " set undo directory
endif

" ---------- Quality of life ----------
set mouse=a                    " enable mouse support
if has('clipboard')            
  set clipboard^=unnamed,unnamedplus " use system clipboard
endif
set splitbelow                 " horizontal splits open below
set splitright                 " vertical splits open right
set timeoutlen=500             " shorter delay for mappings

" ---------- Colors ----------
colorscheme lunaperche             " set color scheme (try desert, elflord, evening, etc.)

" ---------- Mappings ----------
let mapleader = ","            " set leader key to comma
nnoremap <silent> <Space> :nohlsearch<CR> " space clears search highlights
nnoremap <leader>w :w<CR>      " ,w to save
nnoremap <leader>q :q<CR>      " ,q to quit
nnoremap Y yy

" Start plugin section
call plug#begin('~/.vim/plugged')

" File navigation
Plug 'preservim/nerdtree'

" Git integration
Plug 'tpope/vim-fugitive'

" Status/tab line
Plug 'vim-airline/vim-airline'

" Syntax and LSP
Plug 'neovim/nvim-lspconfig'
Plug 'nvim-treesitter/nvim-treesitter', {'do': ':TSUpdate'}

" Fuzzy finder
Plug 'junegunn/fzf', { 'do': { -> fzf#install() } }
Plug 'junegunn/fzf.vim'

" Amp Neovim plugin
Plug 'sourcegraph/amp.nvim'

call plug#end()
" End plugin section


if has('nvim')
  lua << EOF
local function safe_require(mod)
  local ok, result = pcall(require, mod)
  if not ok then
    return nil
  end
  return result
end

-- Try to load the main Amp plugin module. If it's not available, fail gracefully.
local amp = safe_require("amp")
if not amp then
  print("Amp plugin not available (module 'amp' not found')")
  return
end

amp.setup({ auto_start = true, log_level = "info" })

-- Helper to safely use the Amp messaging module.
local function with_amp_message(callback)
  local amp_message = safe_require("amp.message")
  if not amp_message then
    print("Amp messaging module not available")
    return
  end
  callback(amp_message)
end

-- Amp commands
vim.api.nvim_create_user_command("AmpSend", function(opts)
  local message = opts.args
  if message == "" then
    print("Please provide a message to send")
    return
  end

  with_amp_message(function(amp_message)
    amp_message.send_message(message)
  end)
end, {
  nargs = "*",
  desc = "Send a message to Amp",
})

vim.api.nvim_create_user_command("AmpSendBuffer", function(opts)
  local buf = vim.api.nvim_get_current_buf()
  local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)
  local content = table.concat(lines, "\n")

  with_amp_message(function(amp_message)
    amp_message.send_message(content)
  end)
end, {
  nargs = "?",
  desc = "Send current buffer contents to Amp",
})

vim.api.nvim_create_user_command("AmpPromptSelection", function(opts)
  local lines = vim.api.nvim_buf_get_lines(0, opts.line1 - 1, opts.line2, false)
  local text = table.concat(lines, "\n")

  with_amp_message(function(amp_message)
    amp_message.send_to_prompt(text)
  end)
end, {
  range = true,
  desc = "Add selected text to Amp prompt",
})

vim.api.nvim_create_user_command("AmpPromptRef", function(opts)
  local bufname = vim.api.nvim_buf_get_name(0)
  if bufname == "" then
    print("Current buffer has no filename")
    return
  end

  local relative_path = vim.fn.fnamemodify(bufname, ":.")
  local ref = "@" .. relative_path
  if opts.line1 ~= opts.line2 then
    ref = ref .. "#L" .. opts.line1 .. "-" .. opts.line2
  elseif opts.line1 > 1 then
    ref = ref .. "#L" .. opts.line1
  end

  with_amp_message(function(amp_message)
    amp_message.send_to_prompt(ref)
  end)
end, {
  range = true,
  desc = "Add file reference (with selection) to Amp prompt",
})

-- Amp keybindings
vim.keymap.set('n', '<leader>as', ':AmpSend ', { desc = "Send message to Amp" })
vim.keymap.set('n', '<leader>asb', ':AmpSendBuffer<CR>', { desc = "Send buffer to Amp" })
vim.keymap.set('v', '<leader>aps', ':<C-u>AmpPromptSelection<CR>', { desc = "Add selection to Amp prompt" })
vim.keymap.set('v', '<leader>apr', ':<C-u>AmpPromptRef<CR>', { desc = "Add file reference to Amp prompt" })
EOF
endif

