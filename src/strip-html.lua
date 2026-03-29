local function remove_attrs(elem)
  if elem.attributes then elem.attributes = nil end
  if elem.classes then elem.classes = {} end
  if elem.identifier then elem.identifier = "" end
  return elem
end

function RawBlock(elem)
  return {}
end

function RawInline(elem)
  return {}
end

function Span(elem)
  return elem.content
end

function Div(elem)
  return elem.content
end

function Link(elem)
  return pandoc.Link(elem.content, elem.target, "")
end

function Image(elem)
  if string.match(elem.src, "^data:image") then
    elem.src = ""
  end
  elem.attributes = {}
  elem.classes = {}
  elem.identifier = ""
  return elem
end

function Strong(elem)
  return remove_attrs(elem)
end

function Emph(elem)
  return remove_attrs(elem)
end

function SoftBreak(elem)
  return remove_attrs(elem)
end

function LineBreak(elem)
  return remove_attrs(elem)
end

function Header(elem)
  return pandoc.Header(elem.level, elem.content, "")
end

function CodeBlock(elem)
  return pandoc.CodeBlock(elem.text, "")
end

function BlockQuote(elem)
  return remove_attrs(elem)
end

function Code(elem)
  return pandoc.Code(elem.text, "")
end
