
require 'zlib'

class CharactersController < ApplicationController
  include MageHandController
  skip_before_action :verify_authenticity_token
  before_filter :obsidian_portal_login_required

  CAMP_ID = "2003bb20776111e093d540403656340d"

  def index
    char_url = "/v1/campaigns/#{CAMP_ID}.json"
    resp = obsidian_portal.access_token.get(char_url)
    @camps = JSON.parse(resp.body)
Rails.logger.fatal("GREG: @camps = #{@camps}")

    char_url = "/v1/campaigns/#{CAMP_ID}/characters.json"
    resp = obsidian_portal.access_token.get(char_url)
    @chars = JSON.parse(resp.body)
Rails.logger.fatal("GREG: @chars = #{@chars}")
    render
  end

  def show
    wiki = {}
    begin
      file = File.open("cdata.#{params[:id]}", "rb")
      wiki_str = file.read
      file.close

      if wiki_str.start_with?("V2:")
        enc_data = Base64.decode64(wiki_str[3..-1])
        wiki = JSON.parse(Zlib::Inflate.inflate(enc_data))
      else
        wiki = JSON.parse(Base64.decode64(wiki_str))
      end
    rescue
    end

    char_url = "/v1/campaigns/#{CAMP_ID}/characters/#{params[:id]}.json"
    resp = obsidian_portal.access_token.get(char_url)
    @char = JSON.parse(resp.body)

    wiki_id = 111
    @char['id'] = params[:id]

    respond_to do |format|
        format.html { render layout: "character_view" }
        format.json {

          @char['wiki'] = wiki
          @char['wiki_id'] = wiki_id

Rails.logger.fatal("GREG: @char = #{@char}")

          render json: @char
        }
    end
  end

  def update
    char = params[:data]

    dstring = JSON.pretty_generate(char['wiki'])
    comp_data = Zlib::Deflate.deflate(dstring)
    enc_data = Base64.encode64(comp_data)

    Rails.logger.fatal("GREG: json size = #{dstring.length}")
    Rails.logger.fatal("GREG: comp_data size= #{comp_data.length}")
    Rails.logger.fatal("GREG: enc_data size= #{enc_data.length}")

    IO.write("cdata.#{params[:id]}", "V2:#{enc_data}")

    render json: { "result" => true }
  end

  def current_user
  end
end

