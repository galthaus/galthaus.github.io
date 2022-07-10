package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"runtime"
	"strconv"
	"strings"

	"github.com/sg-gaming/AnimalSpies/v2/api"
	"github.com/spf13/cobra"
)

type registerSection func(*cobra.Command)

var (
	debug            = false
	endpoint         = "http://127.0.0.1:8100"
	defaultEndpoints = []string{"http://127.0.0.1:8100"}
	token            = ""
	defaultToken     = ""
	username         = "rocketskates"
	defaultUsername  = "rocketskates"
	format           = ""
	defaultFormat    = "game"
	noColor          = false
	defaultNoColor   = false
	// Format is idx=val1,val2,val3;idx2=val1,val2, ...
	// idx = 0 = json string color
	// idx = 1 = json bool color
	// idx = 2 = json number color
	// idx = 3 = json null color
	// idx = 4 = json key color
	// idx = 5 = header color
	// idx = 6 = border color
	// idx = 7 = value1 color
	// idx = 8 = value2 color
	colorString           = "0=32;1=33;2=36;3=90;4=34,1;5=35,6=95;7=32;8=92"
	defaultColorString    = "0=32;1=33;2=36;3=90;4=34,1;5=35;6=95;7=32;8=92"
	printFields           = ""
	defaultPrintFields    = ""
	defaultTruncateLength = 40
	truncateLength        = 40
	noHeader              = false
	defaultNoHeader       = false
	// Session is the global client access session
	Session       *api.Client
	registrations = []registerSection{}
)

func addRegistrar(rs registerSection) {
	registrations = append(registrations, rs)
}

var ppr = func(c *cobra.Command, a []string) error {
	c.SilenceUsage = true
	if Session == nil {
		epInList := false
		for i := range defaultEndpoints {
			if defaultEndpoints[i] == endpoint {
				epInList = true
				break
			}
		}
		if !epInList {
			l := len(defaultEndpoints)
			defaultEndpoints = append(defaultEndpoints, endpoint)
			defaultEndpoints[0], defaultEndpoints[l] = defaultEndpoints[l], defaultEndpoints[0]
		}
		var sessErr error
		for _, endpoint = range defaultEndpoints {
			endpoint = strings.TrimSuffix(endpoint, "/")
			Session, sessErr = api.UserSessionToken(endpoint, username, token)
			if sessErr == nil {
				break
			}
		}
		if sessErr != nil {
			return fmt.Errorf("Error creating Session: %v", sessErr)
		}
	}
	return nil
}

// NewApp is the app start function
func NewApp() *cobra.Command {
	// Don't use color on windows
	if runtime.GOOS == "windows" {
		defaultNoColor = true
	}
	app := &cobra.Command{
		Use:   "client",
		Short: "A CLI application for interacting with the Animal Spies Server",
		Long:  `client info`,
	}
	if dep := os.Getenv("AS_ENDPOINTS"); dep != "" {
		defaultEndpoints = strings.Split(dep, " ")
	}
	if ep := os.Getenv("AS_ENDPOINT"); ep != "" {
		defaultEndpoints = []string{ep}
	}
	if tk := os.Getenv("AS_TOKEN"); tk != "" {
		defaultToken = tk
	}
	if tk := os.Getenv("AS_FORMAT"); tk != "" {
		defaultFormat = tk
	}
	if tk := os.Getenv("AS_PRINT_FIELDS"); tk != "" {
		defaultPrintFields = tk
	}
	if tk := os.Getenv("AS_NO_HEADER"); tk != "" {
		var e error
		defaultNoHeader, e = strconv.ParseBool(tk)
		if e != nil {
			log.Fatal("AS_NO_HEADER should be a boolean value")
		}
	}
	if tk := os.Getenv("AS_NO_COLOR"); tk != "" {
		var e error
		defaultNoColor, e = strconv.ParseBool(tk)
		if e != nil {
			log.Fatal("AS_NO_COLOR should be a boolean value")
		}
	}
	if tk := os.Getenv("AS_COLORS"); tk != "" {
		defaultColorString = tk
	}
	if tk := os.Getenv("AS_TRUNCATE_LENGTH"); tk != "" {
		var e error
		defaultTruncateLength, e = strconv.Atoi(tk)
		if e != nil {
			log.Fatal("AS_TRUNCATE_LENGTH should be an integer value")
		}
	}
	if kv := os.Getenv("AS_KEY"); kv != "" {
		key := strings.SplitN(kv, ":", 2)
		if len(key) < 2 {
			log.Fatal("AS_KEY does not contain a username:token pair!")
		}
		if key[0] == "" || key[1] == "" {
			log.Fatal("AS_KEY contains an invalid username:token pair!")
		}
		defaultUsername = key[0]
		defaultToken = key[1]
	}
	home := ""
	if runtime.GOOS != "windows" {
		home = os.ExpandEnv("${HOME}")
	} else {
		home = os.Getenv("HOMEDRIVE") + os.Getenv("HOMEPATH")
		if home == "" {
			home = os.Getenv("USERPROFILE")
		}
	}
	if data, err := ioutil.ReadFile(fmt.Sprintf("%s/.asrc", home)); err == nil {
		lines := strings.Split(string(data), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			parts := strings.SplitN(line, "=", 2)

			switch parts[0] {
			case "AS_NO_HEADER":
				var e error
				defaultNoHeader, e = strconv.ParseBool(parts[1])
				if e != nil {
					log.Fatal("AS_NO_HEADER should be a boolean value in drpclirc")
				}
			case "AS_NO_COLOR":
				var e error
				defaultNoColor, e = strconv.ParseBool(parts[1])
				if e != nil {
					log.Fatal("AS_NO_HEADER should be a boolean value in drpclirc")
				}
			case "AS_COLORS":
				defaultColorString = parts[1]
			case "AS_ENDPOINT":
				defaultEndpoints = []string{parts[1]}
			case "AS_TOKEN":
				defaultToken = parts[1]
			case "AS_USERNAME":
				defaultUsername = parts[1]
			case "AS_FORMAT":
				defaultFormat = parts[1]
			case "AS_PRINT_FIELDS":
				defaultPrintFields = parts[1]
			case "AS_TRUNCATE_LENGTH":
				var e error
				defaultTruncateLength, e = strconv.Atoi(parts[1])
				if e != nil {
					log.Fatal("RS_TRUNCATE_LENGTH should be an integer value in drpclirc")
				}
			case "AS_KEY":
				key := strings.SplitN(parts[1], ":", 2)
				if len(key) < 2 {
					continue
				}
				if key[0] == "" || key[1] == "" {
					continue
				}
				defaultUsername = key[0]
				defaultToken = key[1]
			}
		}
	}
	app.PersistentFlags().StringVarP(&endpoint,
		"endpoint", "E", defaultEndpoints[0],
		"The Digital Rebar Provision API endpoint to talk to")
	app.PersistentFlags().StringVarP(&username,
		"username", "U", defaultUsername,
		"Name of the Digital Rebar Provision user to talk to")
	app.PersistentFlags().StringVarP(&token,
		"token", "T", defaultToken,
		"token of the Digital Rebar Provision access")
	app.PersistentFlags().BoolVarP(&debug,
		"debug", "d", false,
		"Whether the CLI should run in debug mode")
	app.PersistentFlags().BoolVarP(&noColor,
		"no-color", "N", defaultNoColor,
		"Whether the CLI should output colorized strings")
	app.PersistentFlags().StringVarP(&colorString,
		"colors", "C", defaultColorString,
		`The colors for JSON and Table/Text colorization.  8 values in the for 0=val,val;1=val,val2...`)
	app.PersistentFlags().StringVarP(&format,
		"format", "F", defaultFormat,
		`The serialization we expect for output.  Can be "json" or "yaml" or "text" or "table"`)
	app.PersistentFlags().StringVarP(&printFields,
		"print-fields", "J", defaultPrintFields,
		`The fields of the object to display in "text" or "table" mode. Comma separated`)
	app.PersistentFlags().BoolVarP(&noHeader,
		"no-header", "H", defaultNoHeader,
		`Should header be shown in "text" or "table" mode`)
	app.PersistentFlags().IntVarP(&truncateLength,
		"truncate-length", "j", defaultTruncateLength,
		`Truncate columns at this length`)

	for _, rs := range registrations {
		rs(app)
	}

	// top-level commands that do not need PersistentPreRun go here.
	app.AddCommand(&cobra.Command{
		Use:   "version",
		Short: "Digital Rebar Provision CLI Command Version",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Printf("Version: %v\n", "12.0")
			return nil
		},
	})

	for _, c := range app.Commands() {
		// contents needs some help.
		switch c.Use {
		default:
			c.PersistentPreRunE = ppr
		}
	}
	return app
}

func ResetDefaults() {
	defaultEndpoints = []string{"http://127.0.0.1:8100"}
}
