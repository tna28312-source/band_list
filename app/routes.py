from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from flask_login import login_required, current_user
from app import db
from app.models import Vendor

main = Blueprint("main", __name__)


# ─── 発注先マスタ一覧 ──────────────────────────────
@main.route("/vendor")
@login_required
def vendor_list():
    vendors = Vendor.query.filter_by(is_deleted=False).order_by(
        Vendor.short_name.asc()
    ).all()
    return render_template("vendor_list.html", vendors=vendors)


# ─── 発注先マスタ新規登録 ──────────────────────────
@main.route("/vendor/new", methods=["GET", "POST"])
@login_required
def vendor_new():
    if request.method == "POST":
        name       = request.form.get("name", "").strip()
        short_name = request.form.get("short_name", "").strip()

        error = None
        if not name:
            error = "会社名を入力してください。"
        elif not short_name:
            error = "略称を入力してください。"

        if error:
            form_data = {"name": name, "short_name": short_name}
            return render_template("vendor_new.html", error=error, form_data=form_data)

        vendor = Vendor(
            name=name,
            short_name=short_name,
            created_by=current_user.id,
        )
        db.session.add(vendor)
        db.session.commit()
        return redirect(url_for("main.vendor_list"))

    return render_template("vendor_new.html")


# ─── 発注先マスタ論理削除 ──────────────────────────
@main.route("/vendor/delete", methods=["POST"])
@login_required
def vendor_delete():
    data = request.get_json()
    delete_ids = [int(i) for i in data.get("ids", [])]
    Vendor.query.filter(Vendor.id.in_(delete_ids)).update(
        {"is_deleted": True}, synchronize_session=False
    )
    db.session.commit()
    return jsonify({"ok": True})
