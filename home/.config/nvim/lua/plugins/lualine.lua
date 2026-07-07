return {
  "nvim-lualine/lualine.nvim",
  opts = {
    sections = {
      lualine_c = {
        { "filename", path = 3 }, -- 0=filename, 1=relative, 2=absolute, 3=absolute + shorten
      },
    },
  },
}
