from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User

auth = Blueprint("auth", __name__)


# ─── ユーザー登録 ──────────────────────────────────
@auth.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        password2 = request.form.get("password2", "").strip()

        error = None
        if not username:
            error = "ユーザー名を入力してください。"
        elif not password:
            error = "パスワードを入力してください。"
        elif len(password) < 6:
            error = "パスワードは6文字以上で入力してください。"
        elif password != password2:
            error = "パスワードが一致しません。"
        elif User.query.filter_by(username=username).first():
            error = "このユーザー名はすでに使用されています。"

        if error:
            return render_template("register.html", error=error, username=username)

        user = User(
            username=username,
            password_hash=generate_password_hash(password),
        )
        db.session.add(user)
        db.session.commit()

        login_user(user)
        return redirect(url_for("drawing.drawing_list"))

    return render_template("register.html")


# ─── ログイン ──────────────────────────────────────
@auth.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password_hash, password):
            return render_template("login.html", error="ユーザー名またはパスワードが正しくありません。", username=username)

        login_user(user)
        # ログイン前にアクセスしようとしたページがあればそこへ、なければ図面一覧へ
        next_page = request.args.get("next")
        return redirect(next_page or url_for("drawing.drawing_list"))

    return render_template("login.html")


# ─── ログアウト ────────────────────────────────────
@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("auth.login"))
