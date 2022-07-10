package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/sg-gaming/AnimalSpies/v2/models"
)

type Client struct {
	Endpoint string
	Username string
	Token    string
}

func UserSessionToken(endpoint, username, token string) (*Client, error) {
	return &Client{Endpoint: endpoint, Username: username, Token: token}, nil
}

func (c *Client) ListGames() ([]*models.GameListEntry, error) {
	url := fmt.Sprintf("%s/games?player=%s&token=%s", c.Endpoint, c.Username, c.Token)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	gl := []*models.GameListEntry{}
	err = json.Unmarshal(data, &gl)
	return gl, err
}

func (c *Client) GetGame(gid string) (*models.GameListEntry, error) {
	url := fmt.Sprintf("%s/games/%s?player=%s&token=%s", c.Endpoint, gid, c.Username, c.Token)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%d: %s", resp.StatusCode, string(data))
	}
	gl := &models.GameListEntry{}
	err = json.Unmarshal(data, &gl)
	return gl, err
}

func (c *Client) CreateGame() (*models.GameListEntry, error) {
	url := fmt.Sprintf("%s/games?player=%s&token=%s", c.Endpoint, c.Username, c.Token)
	resp, err := http.Post(url, "application/json", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("Response failed: %d", resp.StatusCode)
	}
	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	gl := &models.GameListEntry{}
	err = json.Unmarshal(data, &gl)
	return gl, err
}

func (c *Client) JoinGame(gid string) (*models.GameListEntry, error) {
	url := fmt.Sprintf("%s/games/%s/join?player=%s&token=%s", c.Endpoint, gid, c.Username, c.Token)
	return c.putData(url, nil)
}

func (c *Client) SplitGame(gid string, split *models.SplitInfo) (*models.GameListEntry, error) {
	url := fmt.Sprintf("%s/games/%s/split?player=%s&token=%s", c.Endpoint, gid, c.Username, c.Token)
	input, err := json.Marshal(split)
	if err != nil {
		return nil, err
	}
	return c.putData(url, input)
}

func (c *Client) SelectGame(gid string, split *models.SelectInfo) (*models.GameListEntry, error) {
	url := fmt.Sprintf("%s/games/%s/split?select=%s&token=%s", c.Endpoint, gid, c.Username, c.Token)
	input, err := json.Marshal(split)
	if err != nil {
		return nil, err
	}
	return c.putData(url, input)
}

func (c *Client) BetGame(gid string, bet *models.BetInfo) (*models.GameListEntry, error) {
	url := fmt.Sprintf("%s/games/%s/bet?select=%s&token=%s", c.Endpoint, gid, c.Username, c.Token)
	input, err := json.Marshal(bet)
	if err != nil {
		return nil, err
	}
	return c.putData(url, input)
}

func (c *Client) putData(url string, input []byte) (*models.GameListEntry, error) {
	var buf *bytes.Buffer
	if input != nil {
		buf = bytes.NewBuffer(input)
	} else {
		buf = bytes.NewBuffer([]byte("{}"))
	}
	req, err := http.NewRequest("PUT", url, buf)
	if err != nil {
		return nil, err
	}
	client := http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	data, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	fmt.Printf("GREG: putData: %d %s\n", resp.StatusCode, string(data))
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Response failed: %d: %s", resp.StatusCode, string(data))
	}
	gl := &models.GameListEntry{}
	err = json.Unmarshal(data, &gl)
	return gl, err
}
