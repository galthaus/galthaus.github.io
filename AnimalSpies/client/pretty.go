package main

import (
	"fmt"

	prettyjson "github.com/hokaccha/go-prettyjson"

	"github.com/fatih/color"

	"github.com/ghodss/yaml"
)

// Pretty marshals object according to the the fmt, in whatever
// passed for "pretty" according to fmt.
func Pretty(f string, obj interface{}) ([]byte, error) {
	return PrettyColor(f, obj, false, nil)
}

// PrettyColor marshals object according to the the fmt, in whatever
// passed for "pretty" according to fmt.  If useColor = true, then
// try to colorize output
func PrettyColor(f string, obj interface{}, useColor bool, colors [][]int) ([]byte, error) {
	switch f {
	case "json":
		f := prettyjson.NewFormatter()
		f.StringColor = color.New(color.FgGreen)
		f.BoolColor = color.New(color.FgYellow)
		f.NumberColor = color.New(color.FgCyan)
		f.NullColor = color.New(color.FgHiBlack)
		f.KeyColor = color.New(color.FgBlue, color.Bold)
		if colors != nil {
			if len(colors) > 0 && colors[0] != nil {
				attrs := make([]color.Attribute, len(colors[0]))
				for i, v := range colors[0] {
					attrs[i] = color.Attribute(v)
				}
				f.StringColor = color.New(attrs...)
			}
			if len(colors) > 1 && colors[1] != nil {
				attrs := make([]color.Attribute, len(colors[1]))
				for i, v := range colors[1] {
					attrs[i] = color.Attribute(v)
				}
				f.BoolColor = color.New(attrs...)
			}
			if len(colors) > 2 && colors[2] != nil {
				attrs := make([]color.Attribute, len(colors[2]))
				for i, v := range colors[2] {
					attrs[i] = color.Attribute(v)
				}
				f.NumberColor = color.New(attrs...)
			}
			if len(colors) > 3 && colors[3] != nil {
				attrs := make([]color.Attribute, len(colors[3]))
				for i, v := range colors[3] {
					attrs[i] = color.Attribute(v)
				}
				f.NullColor = color.New(attrs...)
			}
			if len(colors) > 4 && colors[4] != nil {
				attrs := make([]color.Attribute, len(colors[4]))
				for i, v := range colors[4] {
					attrs[i] = color.Attribute(v)
				}
				f.KeyColor = color.New(attrs...)
			}
		}
		f.DisabledColor = !useColor
		return f.Marshal(obj)
	case "yaml":
		return yaml.Marshal(obj)
	case "go":
		buf, err := Pretty("yaml", obj)
		if err == nil {
			return []byte(fmt.Sprintf("package main\n\nvar contentYamlString = `\n%s\n`\n", string(buf))), nil
		}
		return nil, err
	default:
		return nil, fmt.Errorf("Unknown pretty format %s", f)
	}
}
