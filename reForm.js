(function() {
  var $, ReForm, json_extend;

  $ = jQuery;

  json_extend = function(defaults, config) {
    var extended_json;
    extended_json = {};
    $.extend(true, extended_json, defaults, config);
    return extended_json;
  };

  ReForm = (function() {

    function ReForm(config) {
      this.defaults = {
        form: {
          method: 'POST',
          action: '.',
          id: '',
          "class": '',
          submit_button: true,
          submit_button_label: 'send'
        }
      };
      this.choices = json_extend(this.defaults, config);
      console.dir(this.choices);
      this.container = $("#" + this.choices.container_id);
      this.fields = this.choices.fields;
    }

    /*
        Set of constructors for some common HTML widgets
    */

    ReForm.prototype._common_widgets = {
      'text': function(field) {
        return "<input type=\"text\" class=\"" + field.input_class + "\" id=\"id_" + field.name + "\" name=\"" + field.name + "\" value=\"" + (field.value || '') + "\">";
      },
      'textarea': function(field) {
        return "<textarea class=\"" + field.input_class + "\" id=\"id_" + field.name + "\" name=\"" + field.name + "\">" + (field.value || '') + "</textarea>";
      }
    };

    ReForm.prototype.render = function() {
      var f, fields_template, form_template, submit, widget, _i, _len, _ref,
        _this = this;
      fields_template = "";
      _ref = this.fields;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        f = _ref[_i];
        widget = typeof f.widget === 'string' ? this._common_widgets[f.widget](f) : (new f.widget(f)).render();
        fields_template += "<div class=\"reform-field-wrapper " + f.wrapper_class + "\">\n    <label for=\"id_" + f.name + "\">" + (f.label || f.name) + "</label>\n    <div class=\"reform-field-input\">\n        " + widget + "\n    </div>\n</div>";
      }
      submit = '';
      if (this.choices.form.submit_button) {
        submit = "<div class=\"reform-field-wrapper\">\n    <input type=\"submit\" value=\"" + this.choices.form.submit_button_label + "\">\n</div>";
      }
      form_template = "<form action=\"" + this.choices.form.action + "\"\n      method=\"" + this.choices.form.method + "\"\n      id=\"" + this.choices.form.id + "\"\n      class=\"" + this.choices.form["class"] + "\">\n    " + fields_template + "\n\n    " + submit + "\n</form>";
      this.container.html(form_template);
      this.form = this.container.find('form');
      return this.form.submit(function(evt) {
        evt.preventDefault();
        return _this.submit();
      });
    };

    ReForm.prototype.clean = function() {
      var fields;
      fields = this.form.find(':input');
      return fields.each(function() {
        var tag, type;
        type = this.type;
        tag = this.tagName.toLowerCase();
        if (type === 'text' || type === 'password' || tag === 'textarea') {
          return jQuery(this).val('');
        } else if (type === 'hidden') {
          return jQuery(this).val('');
        } else if (type === 'checkbox' || type === 'radio') {
          return jQuery(this).attr('checked', false);
        } else if (tag === 'select') {
          return jQuery(this).val('');
        }
      });
    };

    ReForm.prototype.toJSON = function() {
      var data, obj, _i, _len, _ref;
      data = {};
      _ref = this.form.serializeArray();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        data[obj.name] = obj.value;
      }
      return data;
    };

    ReForm.prototype.submit = function() {
      var _this = this;
      return $.post(this.choices.form.action, this.toJSON(), function(data) {
        var i, key, node, val, validation_div, _base, _base2, _ref;
        if (data != null ? data.success : void 0) {
          (_this.form.find('.error-field')).remove();
          (_this.form.find('.error')).removeClass('error');
          if (typeof (_base = _this.choices).onSuccess === "function") {
            _base.onSuccess(data);
          }
          if (data.redirect) {
            return window.location = data.redirect;
          } else if (_this.choices.clean_after_save) {
            return _this.clean();
          }
        } else if (data && !data.success) {
          (_this.form.find('.error-field')).remove();
          (_this.form.find('.error')).removeClass('error');
          _ref = data.errors;
          for (key in _ref) {
            val = _ref[key];
            if (key === "all") {
              validation_div = $('#validation-error');
              if (validation_div.length) validation_div.remove();
              _this.form.find('.reform-field-wrapper:last').before("<div id=\"validation-error\" class=\"error-field\">\n    " + val + "\n</div>");
            } else {
              node = _this.form.find("#id_" + key);
              if (!node.length) node = _this.form.find("input[name=" + key + "]");
              i = 0;
              while (!node.is(".reform-field-wrapper") && i < 5) {
                node = node.parent();
                i++;
              }
              node.append("<div class=\"error-field\">\n    " + val + "\n</div>");
              node.parent().addClass('error');
            }
          }
          return typeof (_base2 = _this.choices).onError === "function" ? _base2.onError(data) : void 0;
        }
      }, 'json');
    };

    return ReForm;

  })();

  window.ReForm = ReForm;

  if (window.ReFormNS == null) window.ReFormNS = {};

  window.ReFormNS.json_extend = json_extend;

}).call(this);
