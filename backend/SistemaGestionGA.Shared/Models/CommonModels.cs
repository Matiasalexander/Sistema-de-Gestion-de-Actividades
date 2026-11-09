namespace SistemaGestionGA.Shared.Models;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class DomainRuleException : Exception
{
    public string Code { get; }
    public int StatusCode { get; }

    public DomainRuleException(string message, string code = "REGLA_NEGOCIO", int statusCode = 400)
        : base(message)
    {
        Code = code;
        StatusCode = statusCode;
    }
}

public class ForbiddenScopeException : DomainRuleException
{
    public ForbiddenScopeException(string message = "No tiene autorización sobre la unidad de negocio o recurso solicitado.")
        : base(message, "ALCANCE_NO_AUTORIZADO", 403)
    {
    }
}
