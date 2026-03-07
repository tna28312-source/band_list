from flask import Blueprint, render_template, request, redirect, url_for, session, jsonify
from app import db
from app.models import Drawing, Photo, Delivery
from datetime import date, datetime
import os, uuid
from werkzeug.utils import secure_filename

main = Blueprint("main", __name__)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ─── 図面一覧 ──────────────────────────────────────
@main.route("/")
def drawing_list():
    drawings = Drawing.query.order_by(
        Drawing.project_no.asc(),
        Drawing.drawing_no.asc()
        
    ).all()
    return render_template("drawing_list.html", drawings=drawings)


# ─── 新規登録 ──────────────────────────────────────
@main.route("/drawing/new", methods=["GET", "POST"])
def drawing_new():
    if request.method == "POST":
        # 入力値を取得
        project_no = request.form.get("project_no", "").strip()
        drawing_no = request.form.get("drawing_no", "").strip()
        vendor     = request.form.get("vendor", "").strip()
        order_date_str = request.form.get("order_date", "").strip()
        due_date_str   = request.form.get("due_date", "").strip()

        # バリデーション
        error = None
        order_date = None
        due_date   = None

        try:
            order_date = datetime.strptime(order_date_str, "%Y/%m/%d").date()
        except ValueError:
            error = "発注日は YYYY/MM/DD 形式で入力してください（例：2026/02/10）"

        if not error:
            try:
                due_date = datetime.strptime(due_date_str, "%Y/%m/%d").date()
            except ValueError:
                error = "納期は YYYY/MM/DD 形式で入力してください（例：2026/02/10）"

        # エラーがあれば入力値を保持してフォームを再表示
        if error:
            form_data = {
                "project_no": project_no,
                "drawing_no": drawing_no,
                "vendor":     vendor,
                "order_date": order_date_str,
                "due_date":   due_date_str,
            }
            return render_template("drawing_new.html", error=error, form_data=form_data)

        # DBに保存
        drawing = Drawing(
            project_no=project_no,
            drawing_no=drawing_no,
            vendor=vendor,
            order_date=order_date,
            due_date=due_date,
        )
        db.session.add(drawing)
        db.session.commit()
        return redirect(url_for("main.drawing_list"))

    return render_template("drawing_new.html")


# ─── 納品登録（カートに追加） ──────────────────────
@main.route("/delivery/add/<int:drawing_id>", methods=["POST"])
def delivery_add(drawing_id):
    """納品登録ボタンを押した drawing_id をセッションに追加する"""
    cart = session.get("delivery_cart", [])
    if drawing_id not in cart:
        cart.append(drawing_id)
    session["delivery_cart"] = cart
    return redirect(url_for("main.drawing_list"))


# ─── 納品登録取り消し（カートから削除） ───────────
@main.route("/delivery/remove", methods=["POST"])
def delivery_remove():
    """写真アップロード画面でチェックした drawing_id をセッションから削除する"""
    data = request.get_json()
    remove_ids = [int(i) for i in data.get("ids", [])]
    cart = session.get("delivery_cart", [])
    cart = [i for i in cart if i not in remove_ids]
    session["delivery_cart"] = cart
    return jsonify({"ok": True, "cart": cart})


# ─── 写真アップロード画面 ──────────────────────────
@main.route("/photo/upload", methods=["GET", "POST"])
def photo_upload():
    cart = session.get("delivery_cart", [])
    drawings = Drawing.query.filter(Drawing.id.in_(cart)).all() if cart else []

    if request.method == "POST":
        file = request.files.get("photo")
        drawing_ids = request.form.getlist("drawing_ids")

        if not file or not allowed_file(file.filename):
            return render_template("photo_upload.html", drawings=drawings, error="写真ファイルを選択してください。")

        # ファイル保存
        ext = file.filename.rsplit(".", 1)[1].lower()
        saved_name = f"{uuid.uuid4().hex}.{ext}"
        from flask import current_app
        save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], saved_name)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        file.save(save_path)

        # photos テーブルに登録
        photo = Photo(
            filename=saved_name,
            original_filename=secure_filename(file.filename),
            filepath=f"static/uploads/{saved_name}",
        )
        db.session.add(photo)
        db.session.flush()

        # deliveries テーブルに一括登録
        today = date.today()
        for did in drawing_ids:
            delivery = Delivery(
                drawing_id=int(did),
                photo_id=photo.id,
                delivered_at=today,
            )
            db.session.add(delivery)

        db.session.commit()

        # カートをクリア
        session.pop("delivery_cart", None)

        return redirect(url_for("main.drawing_list"))

    return render_template("photo_upload.html", drawings=drawings)


# ─── 写真モーダル用API ─────────────────────────────
@main.route("/photo/<int:drawing_id>")
def photo_data(drawing_id):
    """納入日リンクをクリックしたときに写真URLをJSONで返す"""
    delivery = Delivery.query.filter_by(drawing_id=drawing_id).first_or_404()
    return jsonify({
        "photo_url": url_for("static", filename=f"uploads/{delivery.photo.filename}"),
        "delivered_at": delivery.delivered_at.strftime("%Y/%m/%d"),
    })
