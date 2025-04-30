from django.contrib.auth.models import User
from django.shortcuts        import render, redirect
from django.contrib.auth     import authenticate, login, logout
from django.contrib          import messages
from .forms                  import RegistrationForm, LoginForm

def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            User.objects.create_user(username=username, password=password)
            messages.success(request, '회원가입이 완료되었습니다.')
            return redirect('account:login')
    else:
        form = RegistrationForm()
    return render(request, 'account/register.html', {'form': form})


def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect('/')
        else:
            print("form errors:", form.errors)
            messages.error(request, '로그인 실패')
    else:
        form = LoginForm()
    return render(request, 'account/login.html', {'form': form})



def logout_view(request):
    logout(request)
    return redirect('/')
