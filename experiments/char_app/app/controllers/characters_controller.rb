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
    char_url = "/v1/campaigns/#{j['campaigns'][0]['id']}/characters/#{params[:id]}.json"
    @char = JSON.parse(obsidian_portal.access_token.get(char_url).body)

    respond_to do |format|
        format.html { render layout: "character_view" }
        format.json { 
          camp_id = @char["campaign"]["id"]
          wiki_all_url = "/v1/campaigns/#{camp_id}/wikis.json"

#          Rails.logger.fatal(JSON.pretty_generate(@char));

          # Check to see if char has a description url, if not add one.
          if !@char["description"].include? "View Character Sheet"
            new_description = @char["description"]
            new_description += "\n\"View Character Sheet\":http://70.113.106.34/character/#{params[:id]}.json"
            d_data = {
              'character' => {
                'description' => new_description
              }
            }

            resp = obsidian_portal.access_token.put(char_url, d_data.to_json,
                                             {'Content-Type' => 'application/x-www-form-urlencoded'})
            Rails.logger.fatal("GREG: response to update description: #{resp.inspect}")
            Rails.logger.fatal("GREG: response to update description: #{resp.body}")
          end

          all_wikis = JSON.parse(obsidian_portal.access_token.get(wiki_all_url).body)

          wiki = nil
          wiki_id = 0
          all_wikis.each do |w|
            #Rails.logger.fatal("GREG: #{w['slug']} ?? #{@char['slug']}")
            if w['slug'] == @char['slug']
              wiki = w
              break
            end
          end

          if wiki == nil
            wiki_create_url = "/v1/campaigns/#{camp_id}/wikis.json"
            my_data = {
               'wiki_page' => {
                 'name' => @char['slug'],
                 'body' => '{}',
                 #'tags' => [ 'CharData' ],
                 'is_game_master_only' => false
               }
            }

            resp = obsidian_portal.access_token.post(wiki_create_url, my_data.to_json,
                                               {'Content-Type' => 'application/x-www-form-urlencoded'})
            #Rails.logger.fatal("GREG: response to create wiki: #{resp.inspect}")
            #Rails.logger.fatal("GREG: response to create wiki: #{resp.body}")

            # Parse to get id
            wiki = JSON.parse(resp.body)

            wiki_id = wiki['id']
            wiki = nil
          else
            wiki_char_url = "/v1/campaigns/#{camp_id}/wikis/#{wiki['id']}.json"
            #Rails.logger.fatal(wiki_char_url)
            resp = obsidian_portal.access_token.get(wiki_char_url)

            #Rails.logger.fatal("GREG: response to read wiki: #{resp.inspect}")
            #Rails.logger.fatal("GREG: response to read wiki: #{resp.body}")

            wiki_id = wiki['id']
            wiki_str = JSON.parse(resp.body)['body']
            if wiki_str == '{}'
              wiki = nil
            else
              wiki = JSON.parse(Base64.decode64(wiki_str))
            end
          end

          @char['wiki'] = wiki
          @char['wiki_id'] = wiki_id

          render json: @char
        }
    end
  end

  def update
    char = params[:data]
    camp_id = char["campaign"]["id"]
    wiki_url = "/v1/campaigns/#{camp_id}/wikis/#{char['wiki_id']}.json"

    my_data = {}
    my_data['wiki_page'] = {}
    my_data['wiki_page']['body'] = Base64.encode64(JSON.pretty_generate(char['wiki']))

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
    ##
    ## {
    ##   'wiki_page': {
    ##     'body': jkj
    ##   }
    ## }

    @resp = obsidian_portal.access_token.put(wiki_url, my_data.to_json,
                                             {'Content-Type' => 'application/x-www-form-urlencoded'})

    render json: { "result" => true }
  end

  def current_user
  end
end
