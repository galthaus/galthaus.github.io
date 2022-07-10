package main

import (
	"fmt"
	"log"
	"os"
	"sort"
	"strconv"
	"strings"

	"github.com/VictorLowther/jsonpatch2/utils"
	"github.com/mattn/go-isatty"
	"github.com/olekukonko/tablewriter"
)

func d(msg string, args ...interface{}) {
	if debug {
		log.Printf(msg, args...)
	}
}

func truncateString(str string, num int) string {
	bnoden := str
	if len(str) > num {
		if num > 3 {
			num -= 3
		}
		bnoden = str[0:num] + "..."
	}
	return bnoden
}

func lamePrinter(obj interface{}) []byte {
	isTable := format == "table"

	if slice, ok := obj.([]interface{}); ok {
		tableString := &strings.Builder{}
		table := tablewriter.NewWriter(tableString)

		var theFields []string
		data := [][]string{}

		colColors := []tablewriter.Colors{}
		headerColors := []tablewriter.Colors{}
		for i, v := range slice {
			if m, ok := v.(map[string]interface{}); ok {
				if i == 0 {
					theFields = strings.Split(printFields, ",")
					if printFields == "" {
						theFields = []string{}
						for k := range m {
							theFields = append(theFields, k)
						}
					}
					if !noColor {
						for range theFields {
							headerColors = append(headerColors, tablewriter.Color(colorPatterns[4]...))
							colColors = append(colColors, tablewriter.Color(colorPatterns[6]...))
						}
					}
				}
				row := []string{}
				for _, k := range theFields {
					row = append(row, truncateString(fmt.Sprintf("%v", m[k]), truncateLength))
				}
				data = append(data, row)
			} else {
				if i == 0 {
					theFields = []string{"Index", "Value"}
					if !noColor {
						headerColors = []tablewriter.Colors{tablewriter.Color(colorPatterns[4]...), tablewriter.Color(colorPatterns[5]...)}
						colColors = []tablewriter.Colors{tablewriter.Color(colorPatterns[6]...), tablewriter.Color(colorPatterns[7]...)}
					}
				}
				data = append(data, []string{fmt.Sprintf("%d", i), truncateString(fmt.Sprintf("%v", obj), truncateLength)})
			}
		}

		if !noHeader {
			table.SetHeader(theFields)
			table.SetHeaderAlignment(tablewriter.ALIGN_LEFT)
			table.SetHeaderLine(isTable)
			if !noColor {
				table.SetHeaderColor(headerColors...)
				table.SetColumnColor(colColors...)
			}
		}
		table.SetAutoWrapText(false)
		table.SetAlignment(tablewriter.ALIGN_LEFT)
		if !isTable {
			table.SetCenterSeparator("")
			table.SetColumnSeparator("")
			table.SetRowSeparator("")
			table.SetTablePadding("\t") // pad with tabs
			table.SetBorder(false)
			table.SetNoWhiteSpace(true)
		}
		table.AppendBulk(data) // Add Bulk Data
		table.Render()
		return []byte(tableString.String())
	}
	if m, ok := obj.(map[string]interface{}); ok {
		theFields := strings.Split(printFields, ",")
		tableString := &strings.Builder{}
		table := tablewriter.NewWriter(tableString)

		if !noHeader {
			table.SetHeader([]string{"Field", "Value"})
			table.SetHeaderLine(isTable)
			if !noColor {
				table.SetHeaderColor(tablewriter.Color(colorPatterns[4]...), tablewriter.Color(colorPatterns[5]...))
				table.SetColumnColor(tablewriter.Color(colorPatterns[6]...), tablewriter.Color(colorPatterns[7]...))
			}
			table.SetHeaderAlignment(tablewriter.ALIGN_LEFT)
		}
		table.SetAutoWrapText(false)
		table.SetAlignment(tablewriter.ALIGN_LEFT)
		if !isTable {
			table.SetCenterSeparator("")
			table.SetColumnSeparator("")
			table.SetRowSeparator("")
			table.SetTablePadding("\t") // pad with tabs
			table.SetBorder(false)
			table.SetNoWhiteSpace(true)
		}

		data := [][]string{}

		if printFields != "" {
			for _, k := range theFields {
				data = append(data, []string{k, truncateString(fmt.Sprintf("%v", m[k]), truncateLength)})
			}
		} else {
			index := []string{}
			for k := range m {
				index = append(index, k)
			}
			sort.Strings(index)
			for _, k := range index {
				v := m[k]
				data = append(data, []string{k, truncateString(fmt.Sprintf("%v", v), truncateLength)})
			}
		}

		table.AppendBulk(data) // Add Bulk Data
		table.Render()
		return []byte(tableString.String())
	}

	// Default for everything else
	return []byte(truncateString(fmt.Sprintf("%v", obj), truncateLength))
}

var colorPatterns [][]int

func processColorPatterns() {
	if colorPatterns != nil {
		return
	}

	colorPatterns = [][]int{
		// JSON
		{32},    // String
		{33},    // Bool
		{36},    // Number
		{90},    // Null
		{34, 1}, // Key
		// Table colors
		{35}, // Header
		{92}, // Value
		{32}, // Header2
		{35}, // Value2
	}

	parts := strings.Split(colorString, ";")
	for _, p := range parts {
		subparts := strings.Split(p, "=")
		idx, e := strconv.Atoi(subparts[0])
		if e != nil {
			continue
		}
		if idx < 0 || idx >= len(colorPatterns) {
			continue
		}
		attrs := strings.Split(subparts[1], ",")
		if len(attrs) == 0 {
			continue
		}
		ii := make([]int, len(attrs))
		for i, attr := range attrs {
			ii[i], e = strconv.Atoi(attr)
			if e != nil {
				ii = nil
				break
			}
		}
		if ii != nil {
			colorPatterns[idx] = ii
		}
	}
}

type Printer interface {
	Print()
}

func prettyPrintBuf(o interface{}) (buf []byte, err error) {
	var v interface{}
	if err := utils.Remarshal(o, &v); err != nil {
		return nil, err
	}
	if format == "game" {
		if pv, ok := o.(Printer); ok {
			pv.Print()
			return []byte(""), nil
		}
		format = "json"
	}

	noColor = noColor || os.Getenv("TERM") == "dumb" || (!isatty.IsTerminal(os.Stdout.Fd()) && !isatty.IsCygwinTerminal(os.Stdout.Fd()))
	processColorPatterns()

	if format == "text" || format == "table" {
		return lamePrinter(v), nil
	}
	return PrettyColor(format, v, !noColor, colorPatterns)
}

func prettyPrint(o interface{}) (err error) {
	var buf []byte
	buf, err = prettyPrintBuf(o)
	if err != nil {
		return
	}
	fmt.Println(string(buf))
	return
}
