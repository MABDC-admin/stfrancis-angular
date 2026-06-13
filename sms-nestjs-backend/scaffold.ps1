npx prisma db push

$modules = @("academic-years", "document-requirements", "academic-records", "learner-movements", "document-requests", "deped-forms", "id-qr-records")

foreach ($mod in $modules) {
    Write-Host "Scaffolding $mod..."
    npx -y @nestjs/cli g module $mod --no-spec
    npx -y @nestjs/cli g controller $mod --no-spec
    npx -y @nestjs/cli g service $mod --no-spec
}
