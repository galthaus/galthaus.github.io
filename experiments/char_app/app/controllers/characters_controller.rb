class CharactersController < ApplicationController
  include MageHandController
  skip_before_action :verify_authenticity_token
  before_filter :obsidian_portal_login_required

  def index
    j = JSON.parse(obsidian_portal.access_token.get('/v1/users/me.json').body)
    @chars = JSON.parse(obsidian_portal.access_token.get("/v1/campaigns/#{j['campaigns'][0]['id']}/characters.json").body)

    render
  end

  def show
    j = JSON.parse(obsidian_portal.access_token.get('/v1/users/me.json').body)
    @char = JSON.parse(obsidian_portal.access_token.get("/v1/campaigns/#{j['campaigns'][0]['id']}/characters/#{params[:id]}.json").body)

    Rails.logger.fatal("GREG: dynamic_sheet = #{@char['dynamic_sheet'].inspect}")
    @char['dynamic_sheet'] = JSON.parse(Base64.decode64(@char['bio']))

    respond_to do |format|
        format.html { render layout: "character_view" }
        format.json { render json: @char }
    end
  end

  def update
    char = params[:data]
    camp_id = char["campaign"]["id"]
    url = "https://api.obsidianportal.com/v1/campaigns/#{camp_id}/characters/#{params[:id]}.json"

    my_data = {}
    my_data['character'] = {}
    my_data['character']['bio'] = Base64.encode64(char['dynamic_sheet'].to_json)
    my_data['character']['dynamic_sheet'] = char['dynamic_sheet']

    ## {
    ##   'character' : {
    ##     'bio' : 'Has joined the party as a mentor',
    ##     'game_master_info' : 'Still is the bbeg',
    ##     'is_game_master_only' : false,
    ##     'dynamic_sheet' : {
    ##       'race' : 'Half-Drow'
    ##     }
    ##   }
    ## }

    @resp = obsidian_portal.access_token.put(url, my_data.to_json,
                                             {'Content-Type' => 'application/x-www-form-urlencoded'})

    Rails.logger.fatal("GREG: response to save: #{@resp.inspect}")
    Rails.logger.fatal("GREG: response to save: #{@resp.body}")

    render json: { "result" => true }
  end

  def current_user
  end
end
