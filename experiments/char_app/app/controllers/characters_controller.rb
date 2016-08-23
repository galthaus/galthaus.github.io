
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

    wiki_id = 111
    @char = { 'id' => params[:id] }

    respond_to do |format|
        format.html { render layout: "character_view" }
        format.json {

          @char['wiki'] = wiki
          @char['wiki_id'] = wiki_id

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

wiki_str="V2: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
547+pwVO6GRTMXtQyQ0/kTGNMvZO9f79fx1vL+0="
