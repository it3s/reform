# reForm.coffee
# This project is licensed under the MIT license terms

# Namespacing
$ = jQuery

json_extend = (defaults, config) ->
    extended_json = {}
    $.extend(true, extended_json, defaults, config)
    extended_json


class ReForm
    constructor: (config) ->
        @defaults =
            form:
                method: 'POST'
                action: '.'
                id: ''
                class: ''
                submit_button: yes
                submit_button_label: 'send'
        @choices = json_extend @defaults, config
        console.dir @choices

        @container = $ "##{@choices.container_id}"

        @fields = @choices.fields

    ###
    Set of constructors for some common HTML widgets
    ###
    _common_widgets:
        'text': (field) ->
            """
            <input type="text" class="#{field.input_class}" id="id_#{field.name}" name="#{field.name}" value="#{field.value or ''}">
            """
        'textarea': (field) ->
            """
            <textarea class="#{field.input_class}" id="id_#{field.name}" name="#{field.name}">#{field.value or ''}</textarea>
            """

    # render template to the DOM
    render: () ->

        fields_template = ""

        for f in @fields
            widget = if typeof f.widget is 'string' then \
                        @_common_widgets[f.widget](f) else (new f.widget(f)).render()

            fields_template += """
                <div class="reform-field-wrapper #{f.wrapper_class}">
                    <label for="id_#{f.name}">#{f.label or f.name}</label>
                    <div class="reform-field-input">
                        #{widget}
                    </div>
                </div>
            """

        submit = ''
        if @choices.form.submit_button
            submit = """
            <div class="reform-field-wrapper">
                <input type="submit" value="#{@choices.form.submit_button_label}">
            </div>
            """
        form_template = """
            <form action="#{@choices.form.action}"
                  method="#{@choices.form.method}"
                  id="#{@choices.form.id}"
                  class="#{@choices.form.class}">
                #{fields_template}

                #{submit}
            </form>
        """
        @container.html form_template

        @form = @container.find 'form'
        @form.submit (evt) =>
            evt.preventDefault()
            @submit()


    clean: () ->
        fields = @form.find ':input'

        fields.each () ->
            type = this.type
            tag = this.tagName.toLowerCase()

            if type is 'text' or type is 'password' or tag is 'textarea'
                jQuery(this).val ''
            else if type is 'hidden'
                jQuery(this).val ''
            else if type is 'checkbox' or type is 'radio'
                jQuery(this).attr 'checked', false
            else if tag is 'select'
                jQuery(this).val ''

    toJSON: () ->
        data = {}
        for obj in @form.serializeArray()
            data[obj.name] = obj.value
        data

    submit: () ->
        $.post(
            @choices.form.action,
            @toJSON(),
            (data) =>
                if data?.success
                    #clean error messages
                    (@form.find '.error-field').remove()
                    (@form.find '.error').removeClass 'error'

                    # on Success callback
                    @choices.onSuccess?(data)

                    if data.redirect
                        window.location = data.redirect
                    else if @choices.clean_after_save
                        @clean()
                else if data and not data.success
                    #clean error messages
                    (@form.find '.error-field').remove()
                    (@form.find '.error').removeClass 'error'

                    for key, val of data.errors

                        if  key is "all"
                            validation_div = $ '#validation-error'
                            validation_div.remove() if validation_div.length

                            @form.find('.reform-field-wrapper:last').before """
                                <div id="validation-error" class="error-field">
                                    #{val}
                                </div>"""
                        else
                            node = @form.find "#id_#{key}"
                            node = @form.find "input[name=#{key}]" if not node.length

                            i = 0
                            while not node.is(".reform-field-wrapper") and i < 5
                                node = node.parent()
                                i++

                            node.append """
                                <div class="error-field">
                                    #{val}
                                </div>"""
                            node.parent().addClass 'error'

                    # on Error callback
                    @choices.onError?(data)
            ,
            'json'
        ) #end of jquery xhr post request

window.ReForm = ReForm

window.ReFormNS ?= {}
window.ReFormNS.json_extend = json_extend

